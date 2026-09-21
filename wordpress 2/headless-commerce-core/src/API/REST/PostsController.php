<?php

namespace HeadlessCommerceCore\API\REST;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST Posts & Blog Categories Controller
 */
class PostsController extends RestController {

	public function register_routes() {
		register_rest_route( $this->namespace, '/posts', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_posts' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/posts/(?P<id>\d+)', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_post_by_id' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/posts/slug/(?P<slug>[a-zA-Z0-9-_]+)', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_post_by_slug' ),
			'permission_callback' => '__return_true',
		) );

		register_rest_route( $this->namespace, '/post-categories', array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_post_categories' ),
			'permission_callback' => '__return_true',
		) );
	}

	public function get_posts( $request ) {
		$page     = max( 1, (int) $request->get_param( 'page' ) ?: 1 );
		$per_page = min( 50, (int) $request->get_param( 'per_page' ) ?: 10 );
		$search   = sanitize_text_field( $request->get_param( 'search' ) ?? '' );

		$args = array(
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => $per_page,
			'paged'          => $page,
		);

		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		$query = new \WP_Query( $args );
		$posts = array();

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$id        = get_the_ID();
				$thumb_id  = get_post_thumbnail_id( $id );
				$image_url = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'full' ) : '';

				$cats       = array();
				$post_terms = get_the_category( $id );
				if ( is_array( $post_terms ) ) {
					foreach ( $post_terms as $t ) {
						$cats[] = array( 'id' => $t->term_id, 'name' => $t->name, 'slug' => $t->slug );
					}
				}

				$posts[] = array(
					'id'         => $id,
					'title'      => get_the_title(),
					'slug'       => get_post_field( 'post_name', $id ),
					'date'       => get_the_date( 'c' ),
					'excerpt'    => get_the_excerpt(),
					'content'    => get_the_content(),
					'image'      => $image_url,
					'categories' => $cats,
					'author'     => get_the_author(),
				);
			}
			wp_reset_postdata();
		}

		return $this->success_response( array(
			'posts' => $posts,
			'total' => (int) $query->found_posts,
			'pages' => (int) $query->max_num_pages,
			'page'  => $page,
		) );
	}

	public function get_post_by_id( $request ) {
		$id   = (int) $request->get_param( 'id' );
		$post = get_post( $id );

		if ( ! $post || $post->post_type !== 'post' || $post->post_status !== 'publish' ) {
			return $this->error_response( 'hcc_post_not_found', 'Post not found', 404 );
		}

		return $this->format_single_post( $post );
	}

	public function get_post_by_slug( $request ) {
		$slug = sanitize_title( $request->get_param( 'slug' ) );

		$args = array(
			'name'           => $slug,
			'post_type'      => 'post',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
		);
		$query = new \WP_Query( $args );

		$post = null;
		if ( $query->have_posts() ) {
			$post = $query->posts[0];
		} else {
			// Check _wp_old_slug for redirects
			$old_slug_query = new \WP_Query( array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'meta_key'       => '_wp_old_slug',
				'meta_value'     => $slug,
				'posts_per_page' => 1,
			) );
			if ( $old_slug_query->have_posts() ) {
				$post = $old_slug_query->posts[0];
			}
		}

		if ( ! $post || $post->post_type !== 'post' || $post->post_status !== 'publish' ) {
			return $this->error_response( 'hcc_post_not_found', 'Post not found', 404 );
		}

		return $this->format_single_post( $post );
	}

	private function format_single_post( $post ) {
		$id        = $post->ID;
		$thumb_id  = get_post_thumbnail_id( $id );
		$image_url = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'full' ) : '';

		$cats       = array();
		$post_terms = get_the_category( $id );
		if ( is_array( $post_terms ) ) {
			foreach ( $post_terms as $t ) {
				$cats[] = array( 'id' => $t->term_id, 'name' => $t->name, 'slug' => $t->slug );
			}
		}

		$author = get_the_author_meta( 'display_name', $post->post_author );
		if ( empty( $author ) ) {
			$author = 'Orbit Expo Crafts Team';
		}

		$seo = class_exists( '\HeadlessCommerceCore\SEO\SEOService' )
			? \HeadlessCommerceCore\SEO\SEOService::get_seo( $id, 'post' )
			: null;

		return $this->success_response( array(
			'id'         => $id,
			'title'      => get_the_title( $id ),
			'slug'       => $post->post_name,
			'date'       => get_the_date( 'c', $id ),
			'excerpt'    => get_the_excerpt( $id ),
			'content'    => apply_filters( 'the_content', $post->post_content ),
			'image'      => $image_url,
			'categories' => $cats,
			'author'     => $author,
			'seo'        => $seo,
		) );
	}

	public function get_post_categories( $request ) {
		$terms = get_terms( array(
			'taxonomy'   => 'category',
			'hide_empty' => false,
		) );

		$categories = array();
		if ( ! is_wp_error( $terms ) && is_array( $terms ) ) {
			foreach ( $terms as $term ) {
				if ( $term->slug === 'uncategorized' ) continue;
				$categories[] = array(
					'id'          => $term->term_id,
					'name'        => $term->name,
					'slug'        => $term->slug,
					'description' => $term->description,
					'count'       => $term->count,
				);
			}
		}

		return $this->success_response( $categories );
	}
}
