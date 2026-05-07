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

    
    Node* current = head;
    int length = 0;
    while (current != NULL) {
        current = current->next;
        length++;
    }

    
    if (k >= length) {
        current = head;
        while (current != NULL) {
            current->data = 0;
            current = current->next;
        }
        return;
    }

    
    current = head;
    for (int i = 0; i < length - k - 1; i++) {
        current = current->next;
    }

    
    Node* newHead = current->next;

    
    current->next = NULL;

    
    current = newHead;
    while (current->next != NULL) {
        current = current->next;
    }

    
    current->next = head;

    
    head = newHead;

    
    current = head;
    for (int i = 0; i < k; i++) {
        current->data = 0;
        current = current->next;
    }
}

void linkedlist::rotateLeft(int k) {
    if (head == NULL || k == 0) return;

    
    Node* current = head;
    int length = 1;
    while (current->next != NULL) {
        current = current->next;
        length++;
    }

    
    k = k % length;
    if (k == 0) return;

    
    current = head;
    for (int i = 1; i < k; i++) {
        current = current->next;
    }

    
    Node* newHead = current->next;
    current->next = NULL;

    
    Node* last = newHead;
    while (last->next != NULL) {
        last = last->next;
    }
    last->next = head;

    
    head = newHead;
}
void linkedlist::rotateRight(int k) {
    
    if (head == NULL || k == 0) return;

    
    Node* current = head;
    int length = 1;
    while (current->next != NULL) {
        current = current->next;
        length++;
    }

    
    k = k % length;
    if (k == 0) return;

    
    current = head;
    for (int i = 1; i < length - k; i++) {
        current = current->next;
    }

    
    Node* newHead = current->next;
    current->next = NULL;

    
    Node* last = newHead;
    while (last->next != NULL) {
        last = last->next;
    }
    last->next = head;

    
    head = newHead;
}
void linkedlist::remove(int size, int idx) {
    
    if (idx < 0 || idx >= size) {
        cout << "Index out of range" << endl;
        return;
    }

    
    if (idx == 0) {
        Node* temp = head;
        head = head->next;
        delete temp;
        return;
    }

    
    Node* temp = head;
    for (int i = 0; temp != NULL && i < idx - 1; i++) {
        temp = temp->next;
    }

    
    if (temp == NULL || temp->next == NULL) {
        return;
    }

    Node* nextNode = temp->next->next;

    
    delete temp->next;
    temp->next = nextNode;
}

void linkedlist::removeAll(int value) {
    
    while (head != NULL && head->data == value) {
        Node* temp = head;
        head = head->next;
        delete temp;
    }

   
    Node* current = head;
    Node* prev = NULL;

    while (current != NULL) {
        if (current->data == value) {
           
            if (prev != NULL) {
                prev->next = current->next;
            }
            delete current;
            current = prev != NULL ? prev->next : head;
        } else {
           
            prev = current;
            current = current->next;
        }
    }
}
bool linkedlist::arraySplitList() {
    if (head == nullptr) return false;

    
    int totalSum = 0;
    Node* temp = head;
    while (temp != nullptr) {
        totalSum += temp->data;
        temp = temp->next;
    }

    
    int runningSum = 0;
    temp = head;
    while (temp != nullptr) {
        if (runningSum == totalSum - runningSum) {
            return true;
        }
        runningSum += temp->data;
        temp = temp->next;
    }

    return false;
}
int linkedlist::Max_Bunch_count() {
    if (head == NULL) return 0;

    Node* current = head;
    int maxBunchSize = 1;
    int currentBunchSize = 1;

    while (current->next != NULL) {
        if (current->data == current->next->data) {
            currentBunchSize++;
        } else {
            if (currentBunchSize > maxBunchSize) {
                maxBunchSize = currentBunchSize;
            }
            currentBunchSize = 1;
        }
        current = current->next;
    }

    
    if (currentBunchSize > maxBunchSize) {
        maxBunchSize = currentBunchSize;
    }
    return maxBunchSize;
    

    
}


int main()
{
    linkedlist source1,source2,source3,source4,source5,source6,source7,source8;
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

    source4.insertNode(10);
    source4.insertNode(20);
    source4.insertNode(30);
    source4.insertNode(40);
    source4.insertNode(50);
    source4.insertNode(60);
    source4.rotateLeft(3);
    source4.printNode();
    cout<<endl;
    
    source5.insertNode(10);
    source5.insertNode(20);
    source5.insertNode(30);
    source5.insertNode(40);
    source5.insertNode(50);
    source5.insertNode(0);
    source5.insertNode(0);
    source5.remove(7,2);
    source5.printNode();
    cout<<endl;

    source6.insertNode(10);
    source6.insertNode(2);
    source6.insertNode(30);
    source6.insertNode(2);
    source6.insertNode(50);
    source6.insertNode(2);
    source6.insertNode(2);
    source6.insertNode(0);
    source6.insertNode(0);
    source6.removeAll(2);
    source6.printNode();
    cout<<endl;

    source7.insertNode(1);
    source7.insertNode(1);
    source7.insertNode(1);
    source7.insertNode(2);
    source7.insertNode(1);
    cout<<boolalpha<<source7.arraySplitList();
    cout<<endl;

    source8.insertNode(1);
    source8.insertNode(1);
    source8.insertNode(2);
    source8.insertNode(2);
    source8.insertNode(1);
    source8.insertNode(1);
    source8.insertNode(1);
    source8.insertNode(1);
    cout<< source8.Max_Bunch_count();
    cout<<endl;
    
     return 0;
}
