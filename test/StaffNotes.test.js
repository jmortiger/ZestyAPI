const E621 = require("./_tests");

describe("StaffNotes", () => {
    // find()
    test("Fetch many StaffNotes", async () => {
        const result = await E621.StaffNotes.find();
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
    });
    // This ignores the param entirely.
    test("Fetch StaffNotes (by creator name)", async () => {
        const result = await E621.StaffNotes.find({ creator_name: "bitWolfy" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        console.log(result.data[0]);
        expect(result.data[0].creator_id).toBe(211960);
    });
    // NOTE: It appears to ignore the @ sign; don't know why.
    test("Fetch StaffNotes (by contents)", async () => {
        const result = await E621.StaffNotes.find({ body: "@bitWolfy" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
    });
    test("Fetch StaffNotes (by response ID)", async () => {
        const result = await E621.StaffNotes.find({ response_to: 113349 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
    test("Fetch StaffNotes (by ID)", async () => {
        const result = await E621.StaffNotes.find({ id: 123 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(1);
        expect(result.data[0].id).toBe(123);
    });
    test("Fetch StaffNotes (by creator ID)", async () => {
        const result = await E621.StaffNotes.find({ creator_id: 211960 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].creator_id).toBe(211960);
    });
    xtest("Fetch StaffNotes (404)", async () => {
        const result = await E621.StaffNotes.find({ creator_name: "abcdefg" });
        expect(result.status.code).toBe(404);
        expect(result.data.length).toBe(0);
    });
    test("Fetch StaffNotes (none found)", async () => {
        const result = await E621.StaffNotes.find({ creator_name: "abcdefg" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(0);
    });

});
