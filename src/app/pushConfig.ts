/* Where the meal-reminder push server lives (push-worker/) and its public key. Both are public by nature: the key only
 * lets a push service check that a push came from that server. The private half is a secret on the server only.
 */
export const PUSH_SERVER_URL = "https://eatright-push.eatright-reminders.workers.dev";
export const PUSH_PUBLIC_KEY = "BImzCBk_t4642UeNnNNHAvsIgBnf0wG69jWO-txU4B-2CUA2uSb3BWZLHsz2cKZThMlboAyUi41c7wtNs0zY89c";
