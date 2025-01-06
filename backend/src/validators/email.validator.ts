import validator from 'validator';

const emailValidator = (email: string): string | null => {

  if (!validator.isEmail(email)) {
    return 'Email is invalid';
  }

  return null;
};

export default emailValidator;