import Endpoint, { CommonParams, Ordering, SearchParams, UserIdParam } from "../components/Endpoint";
import { FormattedResponse } from "../components/RequestQueue";
import { ApiStaffNote } from "../responses/ApiStaffNote";

/**
 * @todo Add editing & single-item retrieval support.
 */
export default class StaffNotesEndpoint extends Endpoint<ApiStaffNote<true>> {

    protected override endpoint = "staff_notes";
    protected override searchParams: string[] = [
        "id",
        "created_at",
        "updated_at",
        "creator_name",
        "creator_id",
        "updater_name",
        "updater_id",
        "user_name",
        "user_id",
        "body_matches",
        "without_system_user",
        "include_deleted",
    ];

    public override find(search: StaffNoteSearchParams = {}): Promise<FormattedResponse<ApiStaffNote<true>>> { return super.find(search); }
}


interface StaffNoteSearchParams<NonSerialized extends boolean = boolean> extends SearchParams, CommonParams<NonSerialized> {
    creator_name?: string,
    creator_id?: UserIdParam<NonSerialized>,
    updater_name?: string,
    updater_id?: UserIdParam<NonSerialized>,
    user_name?: string,
    user_id?: UserIdParam<NonSerialized>,
    body_matches?: string,
    without_system_user?: boolean,
    include_deleted?: boolean,
    // False value; accepted but throws error on server.
    // resolved?: boolean,
    // Supported but unpermitted.
    // order?: Ordering,
}
