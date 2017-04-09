#include<stdio.h>
#include<math.h>
#include<stdlib.h>

#define true 1
#define false 0
typedef int bool;
//10 15 4 20
//10 2 4 8

/* Linked list node */
typedef struct node{
    int data;
    struct node *link;
} node;

/* A utility function to insert a node at the beginning of a linked list*/
void add(node * * head_ref, int new_data);

/* A utility function to check if given data is present in a list */
bool isPresent(node * head, int data);

/* A utility function to check if given element is present in Set a */
bool belongsto(node * head, int key);

/* Function to get union of two linked lists head1 and head2 */
node *Union(node * head1, node * head2) { //hey brian
    node *result = NULL;
    node *t1 = head1; node *t2 = head2; //if it wasnt, it is now
    // Insert all elements of list1 to the result list //
    while (t1 != NULL) {
        add (&result, t1->data);
        t1 = t1->link;
    }
    while (t2 != NULL) {
        if (!belongsto(result, t2->data))
            add(&result, t2->data);
        t2 = t2->link;
    }
    return result;
}

/* Function to get intersection of two linked lists head1 and head2 */
node * Intersection(node * head1, node *head2)
{
    node * result = NULL;
    node * t1 = head1;
    // Traverse list1 and search each element of it in
    // list2. If the element is present in list 2, then
    // insert the element to result
    while (t1 != NULL)
    {
        if (belongsto(head2, t1->data))
            add(&result, t1->data);
        t1 = t1->link;
    }
    return result;
}

/* A utility function to insert a node at the begining of a linked list*/
void add (node * * head_ref, int new_data)
{
    node *new_node = (struct node*) malloc (sizeof (node));
    new_node->data = new_data;
    new_node->link = *head_ref;
    *head_ref = new_node;
}

/* A utility function to print a linked list*/
void setdisplay (node * node)
{
    while (node != NULL)
    {
        printf ("%d ", node->data);
        node = node->link;
    }
}

/* tests if A belongs to B */ //
bool belongsto(node * head, int key) {
    node *temp = head;
    while (temp != NULL) {
        if (temp->data == key) {
            return true;
        }
        temp = temp->link;
    }
    return false;
}
node * Difference(node *head1, node *head2) {

    node *result = NULL;
    node *t1 = head1, *t2 = head2;
    // Insert all elements of list1 to the result list
    while (t1 != NULL) {
        if (!belongsto(t2, t1->data))
            add(&result, t1->data);
        t1 = t1->link;
    }
    return result;


}

node *Symmetricdiff(node *head1, node *head2){
    node *result = Union(Difference(head1, head2), Difference(head2,head1));
    /*
    node *t1 = head1, *t2 = head2;

    // Insert all elements of list1 to the result list
    while (t2 != NULL && t2 != NULL)
    {
        add(&result, t2->data);
        t2 = t2->link;
        add(&result, t1->data);
        t1= t1->link;
        return result;
    // Traverse list1 and search each element of it in
    // list2. If the element is present in list 2, then
    //* insert the element to result

        if (!belongsto(head1, t2->data))
            add (&result, t2->data);
        t2 = t2->link;


    }
    */
    return result;
}

bool issubset (node *head1, node *head2) {
    node * first;
    if (first == NULL)
        return false;
    for (first = head1; first->link != NULL; first = first->link) {
        if ( !belongsto (head2, first->data))
            return false;
    }
    return true;
}
bool equals (node * head1, node * head2) {
    return issubset (head1, head2) && issubset (head2, head1);
}




