import validator from 'validator';

const registerEmailValidator = (email: string): string | null => {

  if (!validator.isEmail(email)) {
    return 'Email is invalid';
  }

  return null;
};

export default registerEmailValidator;