import APIResponse from "./APIResponse";

export interface APIDMail extends APIResponse {
    id: number;
    owner_id: number;
    from_id: number;
    to_id: number;
    title: string;
    body: string;
    is_read: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    owner_name: string;
    from_name: string;
}
