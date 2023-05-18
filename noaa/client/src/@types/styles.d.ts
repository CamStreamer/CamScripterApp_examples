declare type TStyleSheet = Record<string, React.CSSProperties>;
declare type TServerData = {
    station_id: number;
    location_name: string;
    camera_ip: string;
    camera_port: number;
    camera_user: string;
    camera_pass: string;
    cg_service_id: number | null;
    cg_field_name: string | null;
    it_service_id: number | null;
    data_refresh_rate_s: number;
};
