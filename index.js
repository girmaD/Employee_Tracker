// Importing dependecies
// =================================================
const mysql = require('mysql');
const inquirer = require('inquirer');
const express = require("express");
const cTable = require('console.table');
require('dotenv').config();


const connection = mysql.createConnection({
    host: "localhost",   
    port: 3306,    
    user: "root",  
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB
});

connection.connect(err => {
    if (err) throw err;
    console.log(`connected as id  ${connection.threadId} \n`);  
    startQuestions();
});
// global variables 
let empArr;

//For fields defined as NOT NULL in the table schema, this function validates by not accepting null values
function notNull(answer) {
    if(answer !== '') {
        return true
    } else {
        console.log('. Please enter an answer to proceed')
        return false
    }    
}

function getEmpArr() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;   
        empArr = []; 
        for(const employee of employees) {
            let emp = employee.first_name;
            empArr.push(emp)
        }
        return empArr;
    })
}

function getRoleArr() {
    connection.query('SELECT * FROM role', (err, roles) => {
        if(err) throw err;
        let roleArr = [];
         for(const role of roles) {
             let listRole = role.title;
             roleArr.push(listRole)
         }
         return roleArr;
    })
}


// retrieving data from tables
function selectTable(table) {
    connection.query(`SELECT * FROM ${table}`, (err, data) => {
        if(err) throw err;
        console.table(data);
        startQuestions();
    })
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
            'Remove employee',
            'Update employee roles',
            'View the total utilized budget of a department',
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
        case 'Remove employee':
            return removeEmployees();
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
    connection.query('SELECT * FROM department', (err, departments) => { 
        if(err) throw err;        
        let deptArr = [];         
        for(const department of departments) {
            let dept = department.name;
            deptArr.push(dept)
        }
       
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
                type: 'list',
                name: 'dept',
                message: 'What department this role belongs to?',
                choices: deptArr
            }
        ])
        .then(res => {
            let deptId;
            for(let i = 0; i < departments.length; i++) {
                if(departments[i].name === res.dept) {
                    deptId = departments[i].id;
                }
            }
            
            let query = 'INSERT INTO role SET ?';
            connection.query(query, 
                {
                    title: res.title,
                    salary: res.salary || null,
                    department_id: deptId || null
                }, 
            (err) => {
                if(err) throw err;
                console.log('New role has been added to the database')
                startQuestions();
            })
        })
    })
}

function addEmployees() {
    let roleTitle = []; 
    let empArr = [];
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;        
        for(const employee of employees) {
            let emp = `${employee.first_name} ${employee.last_name}`;
            empArr.push(emp)
        } 
    })
    connection.query('SELECT * FROM role', (err, roles) => { 
        if(err) throw err;                
        for(const role of roles) {
            let title = role.title;
            roleTitle.push(title)
        }
    
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
                type: 'list',
                name: 'role',
                message: 'What is the role of this employee?',
                choices: roleTitle
            },
            {
                type: 'list',
                name: 'manager',
                message: 'What is the manager name of this employee?',
                choices: empArr
            }
        ])
        .then(res => {
            let roleId;
            for(let i = 0; i < roles.length; i++) {
                if(roles[i].title === res.role) {
                    roleId = roles[i].id;
                }
            }
            connection.query('SELECT * FROM employee WHERE CONCAT(first_name, " ", last_name) = ?', [res.manager], (err, manager) => {
                if(err) throw err;               
                // console.log(employee)
                let query = 'INSERT INTO employee SET ?';
                connection.query(query, 
                    {
                        first_name: res.fName,
                        last_name: res.lName,
                        role_id: roleId || null,
                        manager_id: manager[0].id || null
                    }, 
                (err) => {
                    if(err) throw err;
                    console.log('New employee has been added to the database')
                    startQuestions();
                })
            })
        })
    })
}

function viewDepartments() {        
    selectTable('department');
}

function viewRoles() {
    let query = 'SELECT role.id, role.title, department.name AS Department, role.salary FROM role LEFT JOIN department ON role.department_id = department.id'
    connection.query(query, (err, roles) => {
        if(err) throw err;        
        console.table(roles);        
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
                        'view employees by department',
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
            case 'view employees by department':
                return viewEmployeesByDepartment();
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
    selectTable('employee');
}

function viewEmployeesByDepartment() {  
    connection.query('SELECT * FROM department', (err, departments) => { 
        if(err) throw err;        
        let deptArr = [];         
        for(const department of departments) {
            let dept = department.name;
            deptArr.push(dept)
        }
        inquirer.prompt(
            {
                type: 'list',
                name: 'depts',
                message: 'Which department would like to see employees for?',
                choices: deptArr
            }
        )
        .then(res => {
            let query = `SELECT employee.id, employee.first_name, employee.last_name, role.title FROM employee  LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id WHERE department.name = ? ORDER BY department.name`;
                           
            connection.query(query, [res.depts], (err, empByDept) => {
                if(err) throw err;
                console.table(empByDept)
                startQuestions();
            })
        })
    })    
}

function viewEmployeesByManager() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;
        let empArr = [];
        for(const employee of employees) {
            let emp = `${employee.first_name} ${employee.last_name}`;
            empArr.push(emp)
        } 
        
        inquirer.prompt (
            {
                type: 'list',
                name: 'manager',
                message: 'Under which manager?',
                choices: empArr
            }
        ) 
        .then(res => {
            connection.query('SELECT id FROM employee WHERE CONCAT(first_name, " ", last_name) = ?', [res.manager], (err, manId) => {
                if(err) throw err;                
                connection.query('SELECT * FROM employee WHERE manager_id = ?', [manId[0].id], (err, employees) => {
                    if(err) throw err;                    
                    console.table(employees);                           
                    startQuestions();
                })
            })
        })       
    })
}

// a function to remove employee from the database
function removeEmployees() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;
        let empArr = [];
        for(const employee of employees) {
            let emp = `${employee.first_name} ${employee.last_name}`;
            empArr.push(emp)
        }    
        inquirer.prompt(
            {
                type: 'list',
                name: 'select',
                message: 'Which employee would you like to delete?',
                choices: empArr
            }
        )
        .then(res => {
            connection.query('DELETE FROM employee WHERE CONCAT(first_name, " ", last_name) = ?', [res.select], (err)=>{
                if(err) throw err;
                console.log(`${res.select} has been deleted from the database`)
                startQuestions();
            })
        })
    })
   
}
// A function to update employee roles
//====================================
function updateEmployeeRoles() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;
        let empArr = [];
        for(const employee of employees) {
            let emp = `${employee.first_name} ${employee.last_name}`
            empArr.push(emp)
        }
   
        inquirer.prompt(
            {
                type: 'list',
                name: 'employee',
                message: 'Which employee would you like to update the role of?',
                choices: empArr
            }
        )
        .then(answer => {
            connection.query('SELECT * FROM role', (err, roles) => {
               if(err) throw err;
               let roleArr = [];
                for(const role of roles) {
                    let listRole = role.title;
                    roleArr.push(listRole)
                }            
                inquirer.prompt(
                    {
                        type: 'list',
                        name: 'role',
                        message: 'To which role would like to update?',
                        choices: roleArr
                    }
                )               
                .then(res => {                   
                    connection.query('SELECT * FROM role WHERE role.title = ?', [res.role], (err, data) => {
                        if(err) throw err;
                        let newId = data[0].id
                        connection.query(`UPDATE employee SET employee.role_id = '${newId}' WHERE CONCAT(employee.first_name, " ", employee.last_name) = ?`, [answer.employee], (err) => {
                            if(err) throw err;
                            console.log('role has been updated');
                            startQuestions();
                        })
                    })
                })
            })
        })
    })
}

