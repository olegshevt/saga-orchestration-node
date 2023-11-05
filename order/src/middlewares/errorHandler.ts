import { Request, Response, NextFunction } from 'express';

interface ExtendedError extends Error {
    status?: number;
    message: string;
}

const handleErrors = (err: ExtendedError, req: Request, res: Response, next: NextFunction): void => {
    const status = err.status && err.status >= 400 ? err.status : 500;
    const message = err.message || 'An unexpected error occurred';

    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(status).json({ message });
};

export default handleErrors;