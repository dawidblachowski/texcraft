import validator from 'validator';

const registerPasswordValidator = (password: string): string | null => {

    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters long';
    }

    // if (!password.match(/[a-z]/)) {
    //     return 'Password must contain at least one lowercase letter';
    // }

    // if (!password.match(/[A-Z]/)) {
    //     return 'Password must contain at least one uppercase letter';
    // }

    // if (!password.match(/[0-9]/)) {
    //     return 'Password must contain at least one digit';
    // }

  return null;
};

export default registerPasswordValidator;