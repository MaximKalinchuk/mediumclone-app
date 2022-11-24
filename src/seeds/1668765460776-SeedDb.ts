import {MigrationInterface, QueryRunner} from "typeorm";

export class SeedDb1668765460776 implements MigrationInterface {
    name = 'SeedDb1668765460776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO tags (name) VALUES ('dragons'), ('coffee')`);
        
        //pass: 1234
        await queryRunner.query(`INSERT INTO users (username, email, password) VALUES ('max', 'max@gmail.ru', '$2b$10$JN/dYY6YirMiSkqU4Pbo9.Jxh8EKdLEHCBguWSARVQTT1vjujOZ5m')`);

        await queryRunner.query(`INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First Article', 'first article desc', 'first article body', 'coffee,dragons', 1)`);
    
        await queryRunner.query(`INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('sec-article', 'Sec Article', 'sec article desc', 'sec article body', 'coffee,dragons', 1)`);

    }
    

    public async down(): Promise<void> {}

}
