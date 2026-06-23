const ageTargets = document.querySelectorAll('[data-age]');

function currentAge(date = new Date()) {
  const currentYear = date.getFullYear();
  const birthdayThisYear = new Date(currentYear, 8, 18);
  return currentYear - 2008 - Number(date < birthdayThisYear);
}

ageTargets.forEach((target) => {
  target.textContent = currentAge();
});

document.querySelectorAll('[data-year]').forEach((target) => {
  target.textContent = new Date().getFullYear();
});
