#include<iostream>
using namespace std;
class Node{
public:
int data;
Node* next;
Node* prev;
Node()
{
    data=0;
    next=NULL;
}
Node(int data)
{
    this->data=data;
    this->next=NULL;
}
};
class linkedlist{
public:
Node* head;
linkedlist()
{
    head=NULL;
}
void insertElement(int);
void display();
void shiftLeft(int);
void shiftRight(int);
};

void linkedlist::insertElement(int data)
{

Node* NewNode=new Node(data);
if(head==NULL)
{
    return ;
}
Node* temp=head;
while(temp->next!=NULL)
{
    temp=temp->next;
}
temp->next=NewNode;

}
void linkedlist::display()
{
    Node*temp=head;
    while(temp!=NULL)
    {
        cout<<temp->data<<" ";
        temp=temp->next;
    }
}
int main()
{
    linkedlist s1,s2;
    s1.insertElement(10);
    s1.insertElement(20);
    s1.insertElement(30);
    s1.insertElement(40);
    s1.insertElement(50);
    s1.insertElement(60);
    s1.display();
    return 0;
}