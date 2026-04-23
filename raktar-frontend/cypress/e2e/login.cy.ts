describe('Autentikáció (Login) folyamat tesztelése', () => {
  
  beforeEach(() => {
    cy.visit('/'); 
  });

  it('Sikeres bejelentkezés érvényes adatokkal', () => {
    // 1. Felhasználónév mező megkeresése és kitöltése
    cy.get('.space-y-8 > :nth-child(1) > .w-full').type('adi'); // Ez a teszt adat legyen megegyező a backendben létrehozott admin88 felhasználóval!

    // 2. Jelszó mező megkeresése és kitöltése
    cy.get(':nth-child(2) > .w-full').type('User!123'); // Ez a teszt adat legyen megegyező a backendben létrehozott admin88 felhasználó jelszavával!

    // 3. Bejelentkezés gomb megkeresése és kattintás
    cy.get('button[type="submit"]').click();

  }); 
});
