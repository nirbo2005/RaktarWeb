//raktar-backend/src/audit/audit.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            createLog: jest.fn().mockResolvedValue({}),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.findAll when getLogs is called', async () => {
    const mockUser = { id: 1, rang: Role.ADMIN };
    const mockQuery = { admin: true };

    const req = { user: mockUser } as any;

    await controller.getLogs(req, mockQuery as any);

    expect(service.findAll).toHaveBeenCalledWith(
      mockUser.id,
      expect.any(Object),
    );
  });
});
