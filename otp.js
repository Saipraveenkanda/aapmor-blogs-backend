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

//OLD LOGIC FOR GETTING ALL CHARACTERS IN OTP

/* const getCaps = () => {
  let caps = [];
  for (i = 65; i <= 90; i++) {
    caps.push(String.fromCharCode(i));
  }
  return caps[Math.floor(Math.random() * caps.length)];
};

const getSmalls = () => {
  let smalls = [];
  for (i = 97; i <= 122; i++) {
    smalls.push(String.fromCharCode(i));
  }
  return smalls[Math.floor(Math.random() * smalls.length)];
}; */

/* const getOtp = () => {
  const randomNumber = Math.floor(Math.random() * numbers.length);
  const randomSmall = getSmalls();
  const randomCaps = getCaps();

  const otpRandomOrder = [randomNumber, randomCaps, randomSmall];

  let otp = "";
  for (i = 0; i < 6; i++) {
    const randomOtp =
      otpRandomOrder[Math.floor(Math.random() * otpRandomOrder.length)];
    otp += randomOtp;
  }
  return otp;
}; */

exports.getOtp = getOtp;
