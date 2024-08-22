const successResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        error: false,
        message: message,
        data: data,
    });
};

const errorResponse = (res, statusCode, message, details = null) => {
    return res.status(statusCode).json({
        error: true,
        message: message,
        details: details,
    });
};

const validateErrorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        error: true,
        message: message,
    });
};

export default {
    successResponse,
    errorResponse,
    validateErrorResponse
}
