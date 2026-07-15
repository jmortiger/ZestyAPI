const E621 = require("./_tests");

describe("Comments", () => {
    // find()
    test("Fetch many comments", async () => {
        const result = await E621.Comments.find();
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
    });
    test("Fetch comments (by creator name)", async () => {
        const result = await E621.Comments.find({ creator_name: "bitWolfy" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
        expect(result.data[0].creator_id).toBe(211960);
    });
    test("Fetch comments (by body match)", async () => {
        const result = await E621.Comments.find({ body: "permanent" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(75);
    });
    test("Fetch comments (by tag match)", async () => {
        const result = await E621.Comments.find({ post_tags: "mammal" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
    });
    test("Fetch comments (hidden)", async () => {
        const result = await E621.Comments.find({ is_hidden: true });
        expect(result.status.code).toBe(403); // Not permitted without auth
        expect(result.data.length).toBe(0);
    });
    test("Fetch comments (sticky)", async () => {
        const result = await E621.Comments.find({ is_sticky: true });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].is_sticky).toBe(true);
    }, 10000);
    test("Fetch comments (by id)", async () => {
        const result = await E621.Comments.find({ id: 12345 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(1);
        expect(result.data[0].id).toBe(12345);
    });
    test("Fetch comments (by post id)", async () => {
        const result = await E621.Comments.find({ post_id: 12345 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].post_id).toBe(12345);
    });
    test("Fetch comments (by creator id)", async () => {
        const result = await E621.Comments.find({ creator_id: 211960 });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBeGreaterThan(1);
        expect(result.data[0].creator_id).toBe(211960);
    });
    xtest("Fetch comments (404)", async () => {
        const result = await E621.Comments.find({ creator_name: "abcdefg" });
        expect(result.status.code).toBe(404);
        expect(result.data.length).toBe(0);
    });
    test("Fetch comments (none found)", async () => {
        const result = await E621.Comments.find({ creator_name: "abcdefg" });
        expect(result.status.code).toBe(200);
        expect(result.data.length).toBe(0);
    });
});
