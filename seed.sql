-- Insert seed data to department table

INSERT INTO department (name)
VALUES("sales"), ("technology");

-- Insert seed data to role table

INSERT INTO role (title, salary, department_id)
VALUES ("Sales_manager", 120000, 1), ("Developer", 130000, 2);

-- Insert seed data to employee table

INSERT INTO employee (first_name, last_name, role_id)
VALUES ("David", "Corn",  1), ("Girma", "Ebssa", 2);

-- This employee has a manager. His manager is the employee with an id of 2
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Newman", "Noman",  2, 2)

