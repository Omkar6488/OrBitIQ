1. Player Movement Script
C#
using UnityEngine;

public class PlayerMove : MonoBehaviour
{
    public float speed = 5;

    void Update()
    {
        float move = speed * Time.deltaTime;

        if (Input.GetKey(KeyCode.W))
            transform.Translate(0, 0, move);

        if (Input.GetKey(KeyCode.S))
            transform.Translate(0, 0, -move);

        if (Input.GetKey(KeyCode.A))
            transform.Translate(-move, 0, 0);

        if (Input.GetKey(KeyCode.D))
            transform.Translate(move, 0, 0);
    }
}
2. Jump Script
(Add Rigidbody to player)
C#
using UnityEngine;

public class Jump : MonoBehaviour
{
    public float jumpForce = 5;

    Rigidbody rb;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.Space))
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
        }
    }
}
3. Coin Collection Script
(Enable Is Trigger on coin)
C#
using UnityEngine;

public class Coin : MonoBehaviour
{
    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            Destroy(gameObject);
        }
    }
}
4. Score Manager Script
(Create UI → Text first)
C#
using UnityEngine;
using UnityEngine.UI;

public class ScoreManager : MonoBehaviour
{
    public Text scoreText;

    int score = 0;

    public void AddScore()
    {
        score++;

        scoreText.text = "Score : " + score;
    }
}
5. Coin + Score Script
C#
using UnityEngine;

public class Coin : MonoBehaviour
{
    public ScoreManager scoreManager;

    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            scoreManager.AddScore();

            Destroy(gameObject);
        }
    }
}
6. Enemy Follow Script
C#
using UnityEngine;

public class Enemy : MonoBehaviour
{
    public Transform player;

    public float speed = 3;

    void Update()
    {
        transform.position = Vector3.MoveTowards(
            transform.position,
            player.position,
            speed * Time.deltaTime
        );
    }
}
7. Obstacle Collision Script
C#
using UnityEngine;

public class Obstacle : MonoBehaviour
{
    void OnCollisionEnter(Collision collision)
    {
        if (collision.gameObject.CompareTag("Player"))
        {
            Debug.Log("Game Over");
        }
    }
}
8. Auto Moving Obstacle
C#
using UnityEngine;

public class MoveObstacle : MonoBehaviour
{
    public float speed = 5;

    void Update()
    {
        transform.Translate(0, 0, speed * Time.deltaTime);
    }
}
9. Level Change Script
C#
using UnityEngine;
using UnityEngine.SceneManagement;

public class NextLevel : MonoBehaviour
{
    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            SceneManager.LoadScene(1);
        }
    }
}
10. Simple Camera Follow Script
C#
using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    public Transform player;

    void Update()
    {
        transform.position = player.position + new Vector3(0, 5, -5);
    }
}