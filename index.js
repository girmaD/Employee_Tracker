// Importing dependecies
// =================================================
const mysql = require('mysql');
const inquirer = require('inquirer');
const express = require("express");
const cTable = require('console.table');
const { json } = require('express');

const connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: "password",
    database: "company_db"
});

connection.connect(err => {
    if (err) throw err;
    console.log(`connected as id  ${connection.threadId} \n`);  
    startQuestions();
});

//For fields defined as NOT NULL in the table schema, this function validates by not accepting null values
function notNull(answer) {
    if(answer !== '') {
        return true
    } else {
        console.log('. Please enter an answer to proceed')
        return false
    }
}

//Here is the first question to gather information through the command line
const startQuestions = () => inquirer.prompt([
    {
        type: "list",
        name: "todo",
        message: "What would you like to do?",
        choices: [
            "Add departments to the database",
            "Add roles to the database",
            "Add employees to the database",
            "View departments",
            "View roles",
            "View employees",
            "Update employee roles",
            "Exit"
        ]
    }
])
.then(answer => {
    switch(answer.todo) {
        case "Add departments to the database":
            return addDepartments();
            break;
        case "Add roles to the database":
            return addRoles();
            break;        
        case "Add employees to the database":
            return addEmployees();
            break;
        case "View departments":
            return viewDepartments();
            break;
        case "View roles":
            return viewRoles();
            break;
        case "View employees":
            return viewEmployees();
            break;
        case "Update employee roles":
            return updateEmployeeRoles();
            break;
        default:
            connection.end()
    }
})

function addDepartments() {
    inquirer.prompt(
        {
            type: 'input',
            name: 'dept',
            message: 'What department would you like to add?',
            validate: notNull
        }
    )
    .then(res => {
        let query = 'INSERT INTO department SET ?';
        connection.query(query, 
            {
                name: res.dept
            }, 
        (err) => {
            if(err) throw err;
            console.log('New department has been added to the database')
            startQuestions();
        })
    })    
}

function addRoles() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is the title of the role you would like to add?',
            validate: notNull
        },
        {
            type: 'input',
            name: 'salary',
            message: 'What is the salary of the role you would like to add?'
        },
        {
            type: 'input',
            name: 'dept_id',
            message: 'What is the department_id of the role you would like to add?'
        }
    ])
    .then(res => {
        let query = 'INSERT INTO role SET ?';
        connection.query(query, 
            {
                title: res.title,
                salary: res.salary || null,
                department_id: res.dept_id || null
            }, 
        (err) => {
            if(err) throw err;
            console.log('New role has been added to the database')
            startQuestions();
        })
    })
}

function addEmployees() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'fName',
            message: 'What is the first name of the employee you would like to add?',
            validate: notNull
        },
        {
            type: 'input',
            name: 'lName',
            message: 'What is the last name of the employee you would like to add?',
            validate: notNull
        },
        {
            type: 'input',
            name: 'role_id',
            message: 'What is the role_id of this employee?'
        },
        {
            type: 'input',
            name: 'manager_id',
            message: 'What is id of this employee\'s manager?'
        }
    ])
    .then(res => {
        let query = 'INSERT INTO employee SET ?';
        connection.query(query, 
            {
                first_name: res.fName,
                last_name: res.lName,
                role_id: res.role_id || null,
                manager_id: res.manager_id || null
            }, 
        (err) => {
            if(err) throw err;
            console.log('New employee has been added to the database')
            startQuestions();
        })
    })
}

function viewDepartments() {    
    connection.query('SELECT * FROM department', (err, depts) => {
        if(err) throw err;
        let table = [];
        for(const dept of depts) {
           let deptObj = 
                {
                    id: dept.id,
                    name: dept.name
                }
           table.push(deptObj)
        }
        console.table(table);        
        startQuestions();
    })    
}

function viewRoles() {
    connection.query('SELECT * FROM role', (err, roles) => {
        if(err) throw err;
        let table = [];
        for(const role of roles) {
           let roleObj = 
                {
                    id: role.id,
                    title: role.title,
                    salary: role.salary,
                    department_id: role.department_id
                }
           table.push(roleObj)
        }
        console.table(table);        
        startQuestions();
    })
}

function viewEmployees() {
    inquirer.prompt(
        {
            type: 'list',
            name: 'how',
            message: 'How would you like to view employees',
            choices: [
                        'view all employees',                        
                        'view employees by manager',
                        'Exit'       
                     ]
        }
    )
    .then(res => {
        switch(res.how) {
            case 'view all employees':
                return viewAllEmployees();
                break;
            case 'view employees by manager':
                return viewEmployeesByManager();
                break;
            default:
                connection.end();
                break;
        }
    })
}

//functions to view employees
//================================================
function viewAllEmployees() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;
        let empArr = [];
        for(const employee of employees) {
           let empObj = 
                {
                    id: employee.id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    role_id: employee.role_id,
                    manager_id: employee.manager_id
                }
            empArr.push(empObj)
        }
        console.table(empArr);        
        startQuestions();
    })
}

function viewEmployeesByManager() {
    connection.query(`SELECT * FROM employee WHERE manager_id IS NULL`, (err, managers) =>{
        if(err) throw err;
        let managersArr = [];
        for(const manager of managers) {
            let mgr = manager.first_name 
            managersArr.push(mgr)
        }
        inquirer.prompt (
            {
                type: 'list',
                name: 'manager',
                message: 'Under which manager?',
                choices: managersArr
            }
        ) 
        .then(res => {
            connection.query('SELECT id FROM employee WHERE first_name = ?', [res.manager], (err, manId) => {
                if(err) throw err;
                let mgrsId = JSON.parse(JSON.stringify(manId))
                // console.log(mgrsId)
                connection.query('SELECT * FROM employee WHERE manager_id = ?', [mgrsId[0].id], (err, employees) => {
                    let empArr = [];
                    console.log(employees)
                    for(const employee of employees) {
                    let empObj = 
                            {
                                id: employee.id,
                                first_name: employee.first_name,
                                last_name: employee.last_name,
                                role_id: employee.role_id,
                                manager_id: employee.manager_id
                            }
                        empArr.push(empObj)
                    }
                    console.table(empArr);        
                    startQuestions();
                })
            })
        })       
    })
}

