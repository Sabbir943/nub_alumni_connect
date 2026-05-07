CREATE TABLE students (
    student_id INT PRIMARY KEY,
    name VARCHAR(50),
    age INT
);
INSERT INTO students (student_id, name, age) VALUES
(1, 'Alice', 20),
(2, 'Bob', 22),
(3, 'Charlie', 21);
select*from students;