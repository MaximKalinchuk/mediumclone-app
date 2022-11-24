import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUsernameToUsers1669011067615 implements MigrationInterface {
    name = 'AddUsernameToUsers1669011067615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "username" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "username"`);
    }

}
