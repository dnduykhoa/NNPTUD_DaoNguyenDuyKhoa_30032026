/**
 * Script tạo tài khoản admin mặc định
 * Chạy: node seed.js
 */
const mongoose = require('mongoose');
const roleModel = require('./schemas/roles');
const userModel = require('./schemas/users');

async function seed() {
    await mongoose.connect('mongodb://localhost:27017/NNPTUD-C2');
    console.log('Connected to MongoDB');

    // Tạo role ADMIN nếu chưa có
    let adminRole = await roleModel.findOne({ name: 'ADMIN' });
    if (!adminRole) {
        adminRole = await roleModel.create({ name: 'ADMIN', description: 'Quản trị viên' });
        console.log('Created role: ADMIN');
    } else {
        console.log('Role ADMIN already exists');
    }

    // Tạo user admin nếu chưa có
    let existingAdmin = await userModel.findOne({ username: 'admin' });
    if (!existingAdmin) {
        let newAdmin = new userModel({
            username: 'admin',
            password: 'Admin@123',
            email: 'admin@admin.com',
            fullName: 'Administrator',
            role: adminRole._id,
            status: true
        });
        await newAdmin.save();
        console.log('Created admin account:');
        console.log('  username : admin');
        console.log('  password : Admin@123');
        console.log('  email    : admin@admin.com');
    } else {
        console.log('Admin account already exists');
    }

    await mongoose.disconnect();
    console.log('Done.');
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
