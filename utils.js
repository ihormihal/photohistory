exports.randomStr = (length = 8) => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  for (let i = 0; i < length; i++) {
    let index = Math.round(Math.random()*(chars.length - 1));
    str += chars[index];
  }
  return str;
}
exports.dateSort = (data) => {
  return data.sort((a, b) => {
    if (a.date > b.date) return -1
    if (a.date < b.date) return 1
  })
}