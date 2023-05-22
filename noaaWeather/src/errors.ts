export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Network error';
    }
}
