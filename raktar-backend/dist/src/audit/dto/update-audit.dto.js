"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAuditDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_audit_dto_1 = require("./create-audit.dto");
class UpdateAuditDto extends (0, swagger_1.PartialType)(create_audit_dto_1.CreateAuditDto) {
}
exports.UpdateAuditDto = UpdateAuditDto;
//# sourceMappingURL=update-audit.dto.js.map