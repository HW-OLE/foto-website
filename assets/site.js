const birthDate = new Date('2008-09-18T00:00:00');
const ageTargets = document.querySelectorAll('[data-age]');
function ageOn(date) {
  let age = date.getFullYear() - birthDate.getFullYear();
  const birthdayPassed = date.getMonth() > birthDate.getMonth() || (date.getMonth() === birthDate.getMonth() && date.getDate() >= birthDate.getDate());
  return birthdayPassed ? age : age - 1;
}
ageTargets.forEach((target) => { target.textContent = ageOn(new Date()); });
document.querySelectorAll('[data-year]').forEach((target) => { target.textContent = new Date().getFullYear(); });
