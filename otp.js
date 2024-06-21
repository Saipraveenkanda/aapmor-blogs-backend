const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

//NEW LOGIC FOR GETTING ONLY NUMBERS IN OTP

const getOtp = () => {
  let otp = "";
  for (i = 0; i < 6; i++) {
    const randomNumber = Math.floor(Math.random() * numbers.length);
    otp += randomNumber;
  }
  return otp;
};

exports.getOtp = getOtp;
