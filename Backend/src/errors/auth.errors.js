export class PendingActivationError extends Error {
    constructor(message = 'Tu cuenta está pendiente de aprobación por el administrador.') {
        super(message);
        this.name = 'PendingActivationError';
    }
}