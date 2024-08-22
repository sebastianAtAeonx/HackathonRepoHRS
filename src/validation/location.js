import Joi from 'joi'

const createValidate = (value) => {
    const JoiSchema = Joi.object({
        name: Joi.string().trim().min(1).max(255).required().label('Location name'),
        status : Joi.any().optional(),
    }).options({ abortEarly: false })
  
    return JoiSchema.validate(value)
}

const updateValidate = (value) => {
    const JoiSchema = Joi.object({
        id: Joi.number().required().label('Location id'),
        name: Joi.string().trim().min(1).max(255).required().label('Location name'),
        image : Joi.any().optional()
    }).options({ abortEarly: false })
  
    return JoiSchema.validate(value)
}

const idValidate = (value) => {
    const JoiSchema = Joi.object({
        id: Joi.number().required().label('Location id'),
    }).options({ abortEarly: false })
  
    return JoiSchema.validate(value)
}

const imageValidate = (value) => {
    const JoiSchema = Joi.object({
        fieldname: Joi.string().required().label('image'),
        originalname: Joi.string().required().label('image'),
        encoding: Joi.string().required().label('Image'),
        mimetype: Joi.string().valid('image/png', 'image/jpeg', 'image/gif').required().label('image'),
        size: Joi.number().max(5 * 1024 * 1024).required().label("image")    
    }).options({ abortEarly: false })
  
    return JoiSchema.validate(value)
}

export default {
    createValidate,
    updateValidate,
    idValidate,
    imageValidate
}