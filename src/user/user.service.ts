import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/createUser.dto";
import { UserEntity } from "./user.entity";
import { sign } from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { UserResponseInterface } from "./types/userResponse.interface";
import { LoginUserDto } from './dto/loginUser.dto';
import { compare } from 'bcrypt';
import { UpdateUserDto } from './dto/updateUserDto';

@Injectable()
export class UserService {

    constructor(@InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>) {}
    
    async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const userByEmail = await this.userRepository.findOne({
            email: createUserDto.email,
        });
        const userByUsername = await this.userRepository.findOne({
            email: createUserDto.username,
        });
        if (userByEmail || userByUsername) {
            throw new HttpException('Email or username are taken', HttpStatus.UNPROCESSABLE_ENTITY)
        }
        console.log(userByEmail)

        const newUser = new UserEntity()
        Object.assign(newUser, createUserDto)
        const userFromDataBase = await this.userRepository.save(newUser);
        delete userFromDataBase.password;
        return userFromDataBase;
    }

    async loginUser(loginUserDto: LoginUserDto): Promise<UserEntity> {
        const userByEmail = await this.userRepository.findOne({
            email: loginUserDto.email
        }, {select: ['id', 'username', 'email', 'bio', 'image', 'password']})

        if(userByEmail === undefined) {
            throw new HttpException('Wrong email or password, try again', HttpStatus.BAD_REQUEST)
        }

        const isPasswordCorrect = await compare(loginUserDto.password, userByEmail.password)
        if(!isPasswordCorrect) {
            throw new HttpException('Wrong email or password, try again', HttpStatus.BAD_REQUEST)
        }

        delete userByEmail.password
        
        return userByEmail;
    }

    async updateUser(userId: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.findById(userId);
        console.log(updateUserDto)
        Object.assign(user, updateUserDto);
        return await this.userRepository.save(user);
    }

    async deleteUser(currentUserId): Promise<string> {
        try {
            const response = await this.userRepository.delete({id: currentUserId})
            console.log(response)
            return 'User was deleted'
        } catch (err) {
            return err
        }
    }

    async findById(id: number): Promise<UserEntity> {
        return await this.userRepository.findOne(id)
    }

    generateJwt(user: UserEntity): string {
        return sign({
            id: user.id,
            username: user.username,
            email: user.email,
        }, JWT_SECRET);
    }

    buildUserResponse(user: UserEntity): UserResponseInterface {
        return {
            user: {
                ...user,
                token: this.generateJwt(user)
            }
        }
    }
}