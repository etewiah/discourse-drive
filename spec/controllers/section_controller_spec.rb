# This is the spec_helper at the root of the discourse directory
require 'spec_helper'
# require './plugins/discourse-plugin-maptopic/spec/drive_spec_helper'
# require './plugins/discourse-plugin-maptopic/spec/vcr_setup'



# describe MapTopic::GeoTopicsController, type: :controller do
#   let(:topic) { create_topic(title: "Poll: Chitoge vs Onodera") }
#   let!(:post) { create_post(topic: topic, raw: "Pick one.\n\n[poll]\n* Chitoge\n* Onodera\n[/poll]") }
#   let(:user1) { Fabricate(:user) }
#   let(:user2) { Fabricate(:user) }
#   let(:admin) { Fabricate(:admin) }
#   # let(:geo_key) { MapTopic::GeoKey.create({city_lower: "berlin"}) }
#   # above does not work

#   # describe "GET index" do
#   #   it "assigns all posts as @posts" do
#   #     Posts::Post.stub(:all) { [mock_post] }
#   #      get :index
#   #      assigns(:posts).should eq([mock_post])
#   #   end
#   # end

#   describe 'get_geo_keys' do
#     # get array of keys representing areas (typically cities) that can be displayed on a map
#     # TODO - add validations and model tests to ensure that they always have a longitude and latitude
#     it "should return okay" do
#       xhr :get, :get_geo_keys,  use_route: :baa
#       # binding.pry
#       response.status.should eq(200)
#     end

# before(:each) do
#   @request.host = "#{mock_subdomain}.example.com"
# end

# TODO - test redirection with this matcher:
# response.should redirect_to '/home'

describe Drive::SectionController do
  # http://pivotallabs.com/writing-rails-engine-rspec-controller-tests/
  # below removes the need to have a 'use_route' for each of my requests
  routes { Drive::Engine.routes }

  describe '#current' do
    describe 'when accessed from a subdomain which is unclaimed' do
      before do
        @request.host = "madrid.lvh.me"
        @request.path = "/current"
      end

      let!(:json) {
        xhr :get, :current, use_route: :baa
        JSON.parse(response.body)
      }

      it 'a section_status of unclaimed is returned' do
        expect(json['section_status']).to eq("unclaimed")
      end

      it 'responds with a 200 status' do
        expect(response.status).to eq(200)
      end
    end
  end


  describe '#directory' do
    before do
      @request.path = "/directory"
    end

    # let(:id) { '1' }
    let!(:json) {
      xhr :get, :directory
      # , use_route: :baa
      JSON.parse(response.body)
    }

    it 'returns an array of discettes' do
      expect(json['discettes']).to eq([])
    end

    it 'responds with a 200 status' do
      expect(response.status).to eq(200)
    end

  end


  # describe '#create' do
  #   let(:message) { 'reason' }
  #   let!(:json) {
  #     post comments_path
  #     JSON.parse(response.body)['errors']
  #   }

  #   it 'returns the error message' do
  #     expect(json['error']).to eq(message)
  #   end

  #   it 'responds with a 422 status' do
  #     expect(response.status).to eq(422)
  #   end
  # end
end
