import Endpoint, { SearchParams } from "../components/Endpoint";
import { FormattedResponse } from "../components/RequestQueue";
import { APIBlip } from "../responses/APIBlip";

export default class BlipsEndpoint extends Endpoint<APIBlip> {

    /*
    Endpoint Notes

    - Returns an empty object `{ blips: [] }` when no results are found in a search

    */

    protected endpoint = "blips";
    protected searchParams = [
        "creator_name", "body_matches", "response_to", "order", // Native
        "id", "creator_id"                                      // Derived
    ];
    protected searchParamAliases = {
        "body": "body_matches",
    }
    public find(search: BlipSearchParams = {}): Promise<FormattedResponse<APIBlip>> { return super.find(search); }

}

interface BlipSearchParams extends SearchParams {
    // Native
    creator_name?: string,
    /// body_matches?: string,
    response_to?: number/*  | null */,
    order?: BlipSearchOrder,

    // Derived
    id?: number,
    creator_id?: number,

    // Aliases
    body?: string,
}

enum BlipSearchOrder {
    Created = "id_desc",
    Updated = "updated_at_desc",
}