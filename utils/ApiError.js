class ApiError{
    constructor(statusCode,message,stack){
        this.statusCode=statusCode;
        this.message=message;
        this.stack=stack
    }
}

module.exports=ApiError;