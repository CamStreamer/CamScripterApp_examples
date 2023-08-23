export type FormInput = {
    modem: {
        token: string;
        device: string;
        refresh_period: number;
    };
    co_camera: {
        protocol: string;
        ip: string;
        port: number | null;
        user: string;
        password: string;
    };
    map_camera: {
        protocol: string;
        ip: string;
        port: number | null;
        user: string;
        password: string;
    };
    overlay: {
        x: number | null;
        y: number | null;
        alignment: string;
        width: number | null;
        height: number | null;
        scale: number | null;
    };
    map: {
        x: number | null;
        y: number | null;
        alignment: string;
        width: number | null;
        height: number | null;

        map_width: number | null;
        map_height: number | null;
        zoomLevel: number | null;
        APIkey: string;
        tolerance: number | null;
    };
};
