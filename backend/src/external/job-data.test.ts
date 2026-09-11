import assert from "node:assert/strict";
import test from "node:test";
import {
  FixtureJobDataProvider,
  JobGroundingService,
} from "./job-data.ts";

test("normalizes and caches external job data", async () => {
  const service = new JobGroundingService(new FixtureJobDataProvider());
  const first = await service.get("job-ux", 1_000);
  const second = await service.get("job-ux", 2_000);

  assert.equal(first.name, "UX 디자이너");
  assert.deepEqual(second.sourceRefs, ["fixture:job-ux"]);
  assert.equal(second.standardTasks.length, 3);
});

test("refreshes the cache after expiry", async () => {
  const service = new JobGroundingService(new FixtureJobDataProvider());
  const first = await service.get("job-ux", 1_000);
  const expiredAt = Date.parse(first.cacheExpiresAt);
  const refreshed = await service.get("job-ux", expiredAt + 1);

  assert.equal(refreshed.cacheExpiresAt, new Date(expiredAt + 24 * 60 * 60 * 1000 + 1).toISOString());
});
