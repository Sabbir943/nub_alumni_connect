/*1. Write a C program to print your name, date of birth, and mobile number.
Expected Output:
Name : Alexandra Abramov
DOB : July 14, 1975
Mobile : 99-9999999999*/




#include<stdio.h>
int main()
{
    //char ch[30]={'S','a','b','b','i','r', 'A','h','m','a','d','\0'};
   // printf("Name :%s",ch);
   char ch1[50];
   char ch2[50];
   printf("Enter your First name:");
   scanf("%s",ch1);

    printf("Enter your second name:");
   scanf("%s",ch2);
   
   char month[50];
   printf("Enter your Birth Month:");
   scanf("%s",&month);
   int date;
   printf("Enter your Birth date:");
   scanf("%d",&date);

int year;
   printf("Enter your Birth year:");
  
    scanf("%d",&year);


   int mobileno;
   printf("Enter your Mobile no:");
   scanf("%d",&mobileno);
   printf("Name :%s %s\n",ch1,ch2);
   printf("DOF :%s %d, %d\n",month,date,year);
   printf("Mobile No: %d\n",mobileno);
    



   


}