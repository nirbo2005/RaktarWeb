"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
class CreateUserDto {
    nev;
    felhasznalonev;
    jelszo;
    email;
    telefonszam;
    admin;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'A névnek szövegnek kell lennie!' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'A név megadása kötelező!' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "nev", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'A felhasználónév nem lehet üres!' }),
    (0, class_validator_1.MinLength)(3, {
        message: 'A felhasználónévnek legalább 3 karakternek kell lennie!',
    }),
    (0, class_validator_1.MaxLength)(20, { message: 'A felhasználónév maximum 20 karakter lehet!' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "felhasznalonev", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'A jelszó nem lehet üres!' }),
    (0, class_validator_1.MinLength)(6, { message: 'A jelszónak legalább 6 karakternek kell lennie!' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "jelszo", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Érvénytelen email cím formátum!' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "telefonszam", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'Az admin mező csak logikai érték lehet!' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "admin", void 0);
//# sourceMappingURL=create-user.dto.js.map