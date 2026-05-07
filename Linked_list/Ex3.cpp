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
    void insertNode(int);
    void printNode();
    void shiftLeft(int k);
    void shiftRight(int k);
    void rotateLeft(int);
    void rotateRight(int);
    void remove(int ,int);
    void removeAll(int);
    bool arraySplitList();
    int Max_Bunch_count();
    
};

void linkedlist::insertNode(int data)
{
    Node* Newnode=new Node(data);
    if(head==NULL)
    {
        head=Newnode;
        return ;
    }

    Node* temp=head;
    while(temp->next!=NULL)
    {
        temp=temp->next;
    }
    temp->next=Newnode;
}


void linkedlist::printNode()
{
    Node* temp=head;
    if(head==NULL)
    {
        cout<<"List empty"<<endl;
    }
    while(temp!=NULL)
    {
        cout<<temp->data<<" ";
        temp=temp->next;
    }
   
}
void linkedlist::shiftLeft(int k)
{
    Node* temp= head;
    if(head==NULL||k==0)
    {
        return ;
    }

    int length=0;
    while(temp!=NULL)
    {
        length++;
        temp=temp->next;
    }
    k%=length;
    if(k==0)
    {
        return ;
    }
    temp=head;
    for(int i=1;i<k;i++)
    {
        if(temp!=NULL)
        {
            temp=temp->next;
        }
    }
    if(temp==NULL||temp->next==NULL)
    {
        return ;
    }
    Node*New_head=temp->next;
    temp->next=NULL;

    Node* end=New_head;
    while(end->next!=NULL)
    {
        end=end->next;
    }
    for(int i=0;i<k;i++)
    {
        end->next=new Node(0);
        end=end->next;
    }
    head=New_head;


}


void linkedlist::shiftRight(int k) {
    if (head == NULL || k <= 0) return;

    // Find the length of the list
    Node* current = head;
    int length = 0;
    while (current != NULL) {
        current = current->next;
        length++;
    }

    // If k is greater than or equal to the length of the list
    if (k >= length) {
        current = head;
        while (current != NULL) {
            current->data = 0;
            current = current->next;
        }
        return;
    }

    // Find the (length-k)th node
    current = head;
    for (int i = 0; i < length - k - 1; i++) {
        current = current->next;
    }

    // current now points to the (length-k)th node
    Node* newHead = current->next;

    // Set current's next to NULL to break the list
    current->next = NULL;

    // Move to the end of the list to link the original head
    current = newHead;
    while (current->next != NULL) {
        current = current->next;
    }

    // Link the original head to the end
    current->next = head;

    // Update head to newHead
    head = newHead;

    // Set the first k nodes to 0
    current = head;
    for (int i = 0; i < k; i++) {
        current->data = 0;
        current = current->next;
    }
}

void linkedlist::rotateLeft(int k) {
    if (head == NULL || k == 0) return;

    // Find the length of the list
    Node* current = head;
    int length = 1;
    while (current->next != NULL) {
        current = current->next;
        length++;
    }

    // If k is greater than the length, reduce it
    k = k % length;
    if (k == 0) return;

    // Find the k-th node and the last node
    current = head;
    for (int i = 1; i < k; i++) {
        current = current->next;
    }

    // current now points to the k-th node
    Node* newHead = current->next;
    current->next = NULL;

    // Find the last node and connect it to the old head
    Node* last = newHead;
    while (last->next != NULL) {
        last = last->next;
    }
    last->next = head;

    // Update the head
    head = newHead;
}
int main()
{
    linkedlist source1,source2 ,source3;
    source1.insertNode(10);
    source1.insertNode(20);
    source1.insertNode(30);
    source1.insertNode(40);
    source1.insertNode(50);
    source1.insertNode(60);
    source1.shiftLeft(3);
    source1.printNode();
    cout<<endl;

    source2.insertNode(10);
    source2.insertNode(20);
    source2.insertNode(30);
    source2.insertNode(40);
    source2.insertNode(50);
    source2.insertNode(60);
    source2.shiftRight(3);
    source2.printNode();
    cout<<endl;

    source3.insertNode(10);
    source3.insertNode(20);
    source3.insertNode(30);
    source3.insertNode(40);
    source3.insertNode(50);
    source3.insertNode(60);
    source3.rotateLeft(3);
    source3.printNode();
    cout<<endl;
}
