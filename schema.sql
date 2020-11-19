-- delete database it a database exists with this name
CROP DATABASE IF EXISTS company_db;

-- create a database named company_db
CREATE DATABASE company_db;

-- for the queries below, use this database
-- this database will be affected by the queries below
USE company_db;

-- create a table called depertment that has columns listed below
CREATE TABLE department (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    PRIMARY KEY (id)
);

-- create a table called role that has columns listed below
CREATE TABLE role (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL(60, 2),
    department_id INT,
    PRIMARY KEY (id)
);

-- create a table called employee that has columns listed below
CREATE TABLE employee (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT,
    manager_id INT,
    PRIMARY KEY (id)
);


