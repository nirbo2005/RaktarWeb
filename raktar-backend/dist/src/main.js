"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'https://raktar-web.vercel.app',
            'https://raktar-web-git-main-nirbo2005s-projects.vercel.app',
            'https://raktar-6t7wbe395-nirbo2005s-projects.vercel.app',
            'https://olahnorbert.hu',
            'http://localhost:5173'
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
}
void bootstrap();
//# sourceMappingURL=main.js.map