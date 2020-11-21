// Importing dependecies
// =================================================
const mysql = require('mysql');
const inquirer = require('inquirer');
const express = require("express");
const cTable = require('console.table');
require('dotenv').config();


const connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB
});

connection.connect(err => {
    if (err) throw err;
    console.log(`connected as id  ${connection.threadId} \n`);  
    startQuestions();
});
// Glaobal variables
// let managersArr = [];
// let deptArr = [];
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
            'Remove employee',
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
    let managersArr = [];
    connection.query(`SELECT * FROM employee WHERE manager_id IS NULL`, (err, managers) => {
        if(err) throw err;        
        for(const manager of managers) {
            let mgr = manager.first_name 
            managersArr.push(mgr)
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
                choices: managersArr
            }
        ])
        .then(res => {
            let roleId;
            for(let i = 0; i < roles.length; i++) {
                if(roles[i].title === res.role) {
                    roleId = roles[i].id;
                }
            }
            connection.query('SELECT * FROM employee WHERE first_name = ?', [res.manager], (err, manager) => {
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
    connection.query('SELECT * FROM department', (err, depts) => {
        if(err) throw err;
        // let table = [];
        // for(const dept of depts) {
        //    let eachDept = dept.name
                
        //    deptArr.push(eachDept)
        // }
        console.table(depts);        
        startQuestions();
    })    
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
                // let mgrsId = JSON.parse(JSON.stringify(manId))
                // console.log(mgrsId)
                connection.query('SELECT * FROM employee WHERE manager_id = ?', [manId[0].id], (err, employees) => {
                    if(err) throw err;
                    let empArr = [];
                    // console.log(employees)
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


// a function to remove employee from the database
function removeEmployees() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;
        let empArr = [];
        for(const employee of employees) {
            let emp = employee.first_name;
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
            connection.query('DELETE FROM employee WHERE first_name =?', [res.select], (err)=>{
                if(err) throw err;
                console.log(`employee ${res.select} has been deleted from the database`)
                startQuestions();
            })
        })
    })
   
}
// a function to update employee roles
// ====================================
function updateEmployeeRoles() {
    let empArr = [];
    let role_idArr = [];
    let rolesArr = [];

    connection.query('SELECT * FROM employee', (err, employees) => {
        if(err) throw err;
            
        for(const employee of employees) {
            let emp = employee.first_name              
            let roleId = employee.role_id    
            empArr.push(emp)     
            role_idArr.push(roleId);
        }
    })
    connection.query('SELECT * FROM role', (err, roles) => {
        if(err) throw err;            
        for(const role of roles) {
            let roleTitle = role.title;
            rolesArr.push(roleTitle)
        }
    })

    inquirer.prompt (
            {
                type: 'list',
                name: 'update',
                message: 'Which employee\'s role would you like to update?',
                choices: empArr 
            },
            {
                type: 'list',
                name: 'role',
                message: 'To what role you want to update to?',
                choices: rolesArr 
            }
    )
    .then(res => {

    })
   
}

