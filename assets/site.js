/* -------------------------------------------------------
   site.js  –  Ole B Fotografie
   ------------------------------------------------------- */

/* ---------- Shared helpers ---------- */

const birthDate = new Date('2008-09-18T00:00:00');

function ageOn(date) {
  let age = date.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    date.getMonth() > birthDate.getMonth() ||
    (date.getMonth() === birthDate.getMonth() && date.getDate() >= birthDate.getDate());
  return birthdayPassed ? age : age - 1;
}

document.querySelectorAll('[data-age]').forEach(
  (t) => { t.textContent = ageOn(new Date()); }
);
document.querySelectorAll('[data-year]').forEach(
  (t) => { t.textContent = new Date().getFullYear(); }
);
