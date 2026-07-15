import Endpoint, { QueryParams } from "../components/Endpoint";
import { FormattedResponse, QueueResponse } from "../components/RequestQueue";
import { PrimitiveMap } from "../components/UtilType";
import { ResponseCode, ResponseStatusMessage } from "../error/ResponseCode";
import { APIIQDBResponse } from "../responses/APIIQDBResponse";

export default class IQDBQueriesEndpoint extends Endpoint<APIIQDBResponse> {
    /**
     * NOTE: Rate limit for IQDB responses changes from 2 seconds to 60 seconds for anonymous users. See https://github.com/e621ng/e621ng/blob/76f76e5ba32f8c334f8a11311aa99f796dc3f69b/app/controllers/iqdb_queries_controller.rb#L57
     */
    private get rateLimit(): number {
        return this.api.adjustIqdbRateLimit ? 2000 : 60000;
    }

    public async find(query: IQDBQueryParams = {}): Promise<FormattedResponse<APIIQDBResponse>> {

        let lookup: PrimitiveMap;
        try { lookup = this.validateParams({}, query); }
        catch (e) { return Endpoint.makeMalformedRequestResponse(); }

        return this.api.makeRequest("iqdb_queries.json", { query: Endpoint.flattenParams(lookup), rateLimit: this.rateLimit })
            .then(
                (response: QueueResponse) => {
                    if (response.data.posts) {
                        response.status.code = ResponseCode.NotFound;
                        response.status.message = ResponseStatusMessage.NotFound;
                        response.data = [];
                    }
                    return Endpoint.formatAPIResponse(response.status, response.data);
                },
                (error: QueueResponse) => {
                    return Endpoint.formatAPIResponse(error.status, []);
                }
            );
    }

    protected validateQueryParams(params?: IQDBQueryParams): IQDBQueryParams {
        const result: IQDBQueryParams = {};

        if (typeof params?.url !== "undefined") result.url = params.url;
        if (typeof params?.post_id !== "undefined") result.post_id = params.post_id;
        if (typeof params?.hash !== "undefined") result.hash = params.hash;
        if (typeof params?.score_cutoff !== "undefined") result.score_cutoff = params.score_cutoff;

        return result;
    }

}

interface IQDBQueryParams extends QueryParams {
    url?: string;
    post_id?: number;
    hash?: string;
    score_cutoff?: number;
}
