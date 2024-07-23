"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = exports.JWTlogin = exports.authenticate = void 0;
var _1 = require(".");
var bcrypt_1 = require("bcrypt");
var jsonwebtoken_1 = require("jsonwebtoken");
var JWT_SECRET = process.env.JWT_SECRET || "tanmay";
var generateToken = function (payload) {
    return (0, jsonwebtoken_1.sign)(payload, JWT_SECRET, { expiresIn: "1h" });
};
var verifyToken = function (token) {
    return (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
};
var decodeToken = function (token) {
    return (0, jsonwebtoken_1.decode)(token);
};
var authenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                token = decodeToken(req.cookies.token);
                if (!token.userId) return [3 /*break*/, 2];
                return [4 /*yield*/, _1.prisma.user.findUnique({
                        where: { id: token.userId },
                    })];
            case 1:
                user = _a.sent();
                if (user) {
                    req.body.user = user;
                    next();
                }
                else {
                    res.status(500).json({ data: {}, message: "Unauthorized" });
                }
                return [3 /*break*/, 3];
            case 2:
                res.status(500).json({ data: {}, message: "Unauthorized" });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("JTWLogin error:", error_1);
                res.status(500).json({ data: {}, message: "Internal Server Error" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.authenticate = authenticate;
var JWTlogin = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var token, user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                token = decodeToken(req.cookies.token);
                if (!token)
                    console.log("No Token Found");
                if (!token.userId) return [3 /*break*/, 2];
                return [4 /*yield*/, _1.prisma.user.findUnique({
                        where: { id: token.userId },
                    })];
            case 1:
                user = _a.sent();
                if (user) {
                    res.status(200).json({ data: user, message: "User Logged In" });
                }
                else {
                    res.status(500).json({ data: {}, message: "User Not Found" });
                }
                return [3 /*break*/, 3];
            case 2:
                res.status(500).json({ data: {}, message: "JWT corupted" });
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_2 = _a.sent();
                console.error("JTWLogin error:", error_2);
                res.status(500).json({ data: {}, message: "Internal Server Error" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.JWTlogin = JWTlogin;
var register = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, email, username, password, user, token, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_1 = _a.name, email = _a.email, username = _a.username, password = _a.password;
                return [4 /*yield*/, _1.prisma.user.create({
                        data: { email: email, name: name_1, username: username, password: (0, bcrypt_1.hashSync)(password, 10) },
                    })];
            case 1:
                user = _b.sent();
                if (user) {
                    token = generateToken({ username: user.username, userId: user.id });
                    // Set token in cookie
                    res.cookie("token", token);
                    res.status(200).json({ data: user, message: "User Created" });
                }
                else {
                    res.status(500).json({ data: {}, message: "User Creation Failed" });
                }
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error("Register error:", error_3);
                res.status(500).json({ data: {}, message: "Internal Server Error" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.register = register;
var login = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, user, token, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, username = _a.username, password = _a.password;
                return [4 /*yield*/, _1.prisma.user.findUnique({ where: { username: username } })];
            case 1:
                user = _b.sent();
                // If User Not Found
                if (!user) {
                    res.status(401).json({ data: {}, message: "User Not Found" });
                    return [2 /*return*/];
                }
                // Compare Password
                if (!(0, bcrypt_1.compareSync)(password, user.password)) {
                    res.status(401).json({ data: {}, message: "Invalid Password" });
                    return [2 /*return*/];
                }
                token = generateToken({ username: user.username, userId: user.id });
                // Set token in cookie
                res.cookie("token", token);
                res.status(200).json({ data: user, message: "User Logged In" });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error("Login error:", error_4);
                res.status(500).json({ data: {}, message: "Internal Server Error" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
