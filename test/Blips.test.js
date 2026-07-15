const E621 = require("./_tests");

describe("Blips", () => {
    // find()
    test("Fetch many blips", async () => {
        const result = await E621.Blips.find();
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
    });
    test("Fetch blips (by creator name)", async () => {
        const result = await E621.Blips.find({ creator_name: "bitWolfy" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].creator_id).toBe(211960);
    });
    test("Fetch blips (by contents)", async () => {
        const result = await E621.Blips.find({ body: "@bitWolfy" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
    });
    test("Fetch blips (by response ID)", async () => {
        const result = await E621.Blips.find({ response_to: 113349 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
    test("Fetch blips (by ID)", async () => {
        const result = await E621.Blips.find({ id: 12345 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(1);
        expect(result.data[0].id).toBe(12345);
    });
    test("Fetch blips (by creator ID)", async () => {
        const result = await E621.Blips.find({ creator_id: 211960 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].creator_id).toBe(211960);
    });
    xtest("Fetch blips (404)", async () => {
        const result = await E621.Blips.find({ creator_name: "abcdefg" });
        expect(result.status.code).toBe(404);
        expect(result.data.length).toBe(0);
    });
    test("Fetch blips (none found)", async () => {
        const result = await E621.Blips.find({ creator_name: "abcdefg" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(0);
    });

});
