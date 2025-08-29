import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface UserDoc {
  interests?: string[];
  displayName?: string;
}

interface CandidateScore {
  userId: string;
  overlap: string[];
  jaccard: number;
  weightedScore: number; // primary sort key
}

// Helper: compute inverse document frequency (IDF) map for interests encountered
function buildIdf(
  totalUsers: number,
  df: Record<string, number>
): Record<string, number> {
  const idf: Record<string, number> = {};
  Object.entries(df).forEach(([term, freq]) => {
    idf[term] = Math.log(1 + totalUsers / (1 + freq)); // smoothed
  });
  return idf;
}

function scoreCandidate(
  userInterests: string[],
  candidateInterests: string[],
  idf: Record<string, number>
): CandidateScore {
  const setUser = new Set(userInterests);
  const setCand = new Set(candidateInterests);
  const overlap = [...setUser].filter((i) => setCand.has(i));
  const unionSize =
    new Set([...userInterests, ...candidateInterests]).size || 1;
  const jaccard = overlap.length / unionSize;
  // Weighted score: sum idf(overlap) * (1 + jaccard) to bias rarer shared interests
  const weightComponent = overlap.reduce(
    (acc, term) => acc + (idf[term] || 0),
    0
  );
  const weightedScore = weightComponent * (1 + jaccard);
  return { userId: "", overlap, jaccard, weightedScore } as CandidateScore; // userId filled by caller
}

async function fetchAllUsersBasic(): Promise<Record<string, UserDoc>> {
  // NOTE: For large user bases this should paginate / sample or maintain a separate interests index.
  const snap = await db
    .collection("Users")
    .select("interests", "displayName")
    .get();
  const map: Record<string, UserDoc> = {};
  snap.forEach((doc) => {
    map[doc.id] = doc.data() as UserDoc;
  });
  return map;
}

async function recomputeForUser(userId: string, maxResults = 15) {
  const userRef = db.collection("Users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const userData = userSnap.data() as UserDoc;
  const interests = Array.isArray(userData.interests) ? userData.interests : [];
  if (interests.length === 0) {
    // clear existing recommendations if any
    const recsCol = userRef.collection("Recommendations");
    const existing = await recsCol.get();
    const batch = db.batch();
    existing.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return;
  }

  const allUsers = await fetchAllUsersBasic();
  const totalUsers = Object.keys(allUsers).length || 1;
  // Build document frequency for IDF
  const df: Record<string, number> = {};
  Object.values(allUsers).forEach((u) => {
    (u.interests || []).forEach((term) => {
      df[term] = (df[term] || 0) + 1;
    });
  });
  const idf = buildIdf(totalUsers, df);

  const scores: CandidateScore[] = [];
  Object.entries(allUsers).forEach(([candidateId, data]) => {
    if (candidateId === userId) return;
    const candidateInterests = Array.isArray(data.interests)
      ? data.interests
      : [];
    if (candidateInterests.length === 0) return;
    const overlap = candidateInterests.filter((i) => interests.includes(i));
    if (overlap.length === 0) return;
    const base = scoreCandidate(interests, candidateInterests, idf);
    base.userId = candidateId;
    scores.push(base);
  });

  scores.sort(
    (a, b) =>
      b.weightedScore - a.weightedScore ||
      b.jaccard - a.jaccard ||
      a.userId.localeCompare(b.userId)
  );
  const top = scores.slice(0, maxResults);

  // Write to subcollection atomically (replace old)
  const recsRef = userRef.collection("Recommendations");
  const existing = await recsRef.get();
  const batch = db.batch();
  existing.forEach((d) => batch.delete(d.ref));
  top.forEach((r) => {
    batch.set(recsRef.doc(r.userId), {
      overlap: r.overlap,
      jaccard: Number(r.jaccard.toFixed(4)),
      weightedScore: Number(r.weightedScore.toFixed(4)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

// Trigger: when a user's interests array changes, recompute their recommendations
export const onUserInterestsWrite = functions.firestore
  .document("Users/{userId}")
  .onWrite(async (change, context) => {
    const beforeInterests = (change.before.data()?.interests || []) as string[];
    const afterInterests = (change.after.data()?.interests || []) as string[];
    // Recompute only if interests changed length or content
    const diff =
      beforeInterests.length !== afterInterests.length ||
      beforeInterests.some((i) => !afterInterests.includes(i)) ||
      afterInterests.some((i) => !beforeInterests.includes(i));
    if (!diff) return;
    try {
      await recomputeForUser(context.params.userId);
    } catch (e) {
      console.error("Recommendation recompute failed", e);
    }
  });

// Callable function for manual refresh from client
export const refreshRecommendations = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Auth required");
    }
    await recomputeForUser(context.auth.uid, data?.limit || 15);
    return { status: "ok" };
  }
);

// (Optional) Scheduled nightly recomputation (requires scheduler configuration)
export const scheduledRecompute = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const usersSnap = await db.collection("Users").select("interests").get();
    for (const docSnap of usersSnap.docs) {
      try {
        await recomputeForUser(docSnap.id);
      } catch (e) {
        console.error("Batch recompute error", docSnap.id, e);
      }
    }
  });
