import Endpoint from "../components/Endpoint";
import { FormattedResponse, QueueResponse } from "../components/RequestQueue";
import Util from "../components/Util";
import APIResponse from "../responses/APIResponse";

export default class UtilityEndpoint extends Endpoint<APIResponse> {

    /**
     * Creates a random string of letters, to be used as an ID.  
     * The IDs are not cryptographically secure, don't use this for anything important.  
     * There is no garbage collection here, don't forget to use `remove()` if you need to use this for a long time.
     * @param unique If false, simply returns a randomized string
     */
    public makeID(unique = true): string {
        return Util.ID.make(unique);
    }

    /**
     * Checks whether the specified ID has been registered
     * @param id String ID to check
     */
    public hasID(id: string): boolean {
        return Util.ID.has(id);
    }

    /**
     * Remove the provided ID from the records.  
     * Make sure that the corresponding element has also been removed, to avoid possible collisions
     * @param id String ID to remove
     * @returns true if the ID existed, false otherwise
     */
    public clearID(id: string): boolean {
        return Util.ID.remove(id);
    }

    /**
     * Checks whether or not e621 is accessible by sending a HEAD request.
     * @returns {boolean} `true` if you are online, `false` otherwise
     */
    public async isOnline(): Promise<boolean> {
        return this.api.makeRequest("posts.json", { method: "HEAD" }).then(
            (response: QueueResponse) => response.status.code == 200,
            () => false,
        )
    }

    /** Test command that always returns error 403 */
    public async test403(): Promise<FormattedResponse<never>> {
        return this.api.makeRequest("test403").then(
            (response: QueueResponse) => { throw new Error("Expected operation to fail."); } /* Endpoint.formatAPIResponse(response.status, response.data) */,
            (error: QueueResponse) => Endpoint.formatAPIResponse(error.status, [] as never[])
        )
    }

    /** Test command that always returns error 404 */
    public async test404(): Promise<FormattedResponse<never>> {
        return this.api.makeRequest("test404").then(
            (response: QueueResponse) => { throw new Error("Expected operation to fail."); } /* Endpoint.formatAPIResponse(response.status, response.data) */,
            (error: QueueResponse) => Endpoint.formatAPIResponse(error.status, [] as never[])
        )
    }

}